/* eslint-disable no-param-reassign */
import { GenericInfo, StudyMetadata, VariantTree } from '../../../../common/types';
import { convertUTCToLocalTime } from '../../../../services/utils';

export interface StudyTree {
    name: string;
    attributes: {
        id: string;
        modificationDate: string;
    }
    drawOptions: {
        depth: number;
        nbAllChildrens: number;
    },
    children: Array<StudyTree>;
}

const buildNodeFromMetadata = (study: StudyMetadata): StudyTree =>
  ({
    name: study.name,
    attributes: {
      id: study.id,
      modificationDate: convertUTCToLocalTime(study.modificationDate),
    },
    drawOptions: {
      depth: 0,
      nbAllChildrens: 0,
    },
    children: [],
  });

const convertVariantTreeToStudyTree = (tree: VariantTree): StudyTree => {
  const nodeDatum = buildNodeFromMetadata(tree.node);
  if (tree.children.length === 0) {
    nodeDatum.drawOptions.depth = 1;
    nodeDatum.drawOptions.nbAllChildrens = 0;
    nodeDatum.children = [];
  } else {
    nodeDatum.children = (tree.children || []).map((el: VariantTree) => convertVariantTreeToStudyTree(el));
    nodeDatum.drawOptions.depth = 1 + Math.max(...nodeDatum.children.map((elm) => elm.drawOptions.depth));
    nodeDatum.drawOptions.nbAllChildrens = nodeDatum.children.map((elm) => 1 + elm.drawOptions.nbAllChildrens)
      .reduce((acc, curr) => acc + curr);
  }

  return nodeDatum;
};

const buildTree = async (node: StudyTree, childrenTree: VariantTree) : Promise<void> => {
  if ((childrenTree.children || []).length === 0) {
    node.drawOptions.depth = 1;
    node.drawOptions.nbAllChildrens = 0;
    return;
  }
  const children = convertVariantTreeToStudyTree(childrenTree);
  node.drawOptions = children.drawOptions;
  node.children = children.children;
};

export const getTreeNodes = async (study: StudyMetadata, parents: Array<StudyMetadata>, childrenTree: VariantTree): Promise<StudyTree> => {
  const currentNode = buildNodeFromMetadata(study);
  await buildTree(currentNode, childrenTree);

  if (parents.length > 0) {
    let prevNode: StudyTree = currentNode;

    for (let i = 0; i < parents.length; i += 1) {
      const elmNode = buildNodeFromMetadata(parents[i]);
      elmNode.drawOptions.depth = 1 + prevNode.drawOptions.depth;
      elmNode.drawOptions.nbAllChildrens = 1 + prevNode.drawOptions.nbAllChildrens;
      if (prevNode.children !== undefined) elmNode.children.push(prevNode);
      prevNode = elmNode;
    }
    return prevNode;
  }

  await buildTree(currentNode, childrenTree);
  return currentNode;
};

export const createListFromTree = (tree: StudyTree) : Array<GenericInfo> => {
  const { name, attributes, children } = tree;
  const { id } = attributes;
  let res : Array<GenericInfo> = [{ id, name }];
  children.forEach((elm) => {
    res = res.concat(createListFromTree(elm));
  });
  return res;
};

export default {};