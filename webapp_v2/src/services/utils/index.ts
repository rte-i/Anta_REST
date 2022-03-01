import moment from 'moment';
import { useSnackbar, OptionsObject } from 'notistack';
import debug from 'debug';
import { StudyMetadataDTO, StudyMetadata, JWTGroup, UserInfo, RoleType, VariantTreeDTO, VariantTree, GenericInfo } from '../../common/types';
import { getMaintenanceMode, getMessageInfo } from '../api/maintenance';
import { getConfig } from '../config';

const logInfo = debug('antares:utils');

export const convertStudyDtoToMetadata = (sid: string, metadata: StudyMetadataDTO): StudyMetadata => ({
  id: sid,
  name: metadata.name,
  creationDate: metadata.created,
  modificationDate: metadata.updated,
  owner: metadata.owner,
  groups: metadata.groups,
  type: metadata.type,
  publicMode: metadata.public_mode,
  version: metadata.version.toString(),
  workspace: metadata.workspace,
  managed: metadata.managed,
  archived: metadata.archived,
  folder: metadata.folder,
});

export const convertVariantTreeDTO = (variantTree: VariantTreeDTO): VariantTree => ({
  node: convertStudyDtoToMetadata(variantTree.node.id, variantTree.node),
  children: (variantTree.children || []).map((child: VariantTreeDTO) => convertVariantTreeDTO(child)),
});

// eslint-disable-next-line no-undef
export const useNotif = (): (message: React.ReactNode, options?: OptionsObject | undefined) => React.ReactText => {
  const { enqueueSnackbar } = useSnackbar();
  return enqueueSnackbar;
};

export const isUserAdmin = (user: UserInfo): boolean => {
  if (user) {
    const adminElm = user.groups.find((elm: JWTGroup) => elm.id === 'admin' && elm.role === RoleType.ADMIN);
    return !!adminElm;
  }
  return false;
};

export const isGroupAdmin = (user: UserInfo): boolean => {
  if (user) {
    const adminElm = user.groups.find((elm: JWTGroup) => elm.role === RoleType.ADMIN);
    return !!adminElm;
  }
  return false;
};

export const roleToString = (role: RoleType): string => {
  switch (role) {
    case RoleType.ADMIN:
      return 'settings:adminRole';

    case RoleType.RUNNER:
      return 'settings:runnerRole';

    case RoleType.WRITER:
      return 'settings:writerRole';

    case RoleType.READER:
      return 'settings:readerRole';

    default:
      break;
  }
  return '';
};

export const hasAuthorization = (user: UserInfo | undefined, study: StudyMetadata, role: RoleType): boolean => {
  if (user) {
    // User is super admin
    if (isUserAdmin(user)) {
      return true;
    }

    if (study) {
      // User is owner of this study
      if (study.owner.id && study.owner.id === user.id) {
        return true;
      }
      // User is admin of 1 of study groups
      return (
        study.groups.findIndex((studyGroupElm) =>
          user.groups.find(
            (userGroupElm) =>
              studyGroupElm.id === userGroupElm.id && userGroupElm.role >= role,
          )) >= 0
      );
    }
  }
  return false;
};

export const getStudyExtendedName = (study: StudyMetadata): string => {
  if (study.folder) {
    return `${study.name} (${study.folder})`;
  }
  return study.name;
};

export const convertUTCToLocalTime = (date: string): string => moment.utc(date).local().format('YYYY-MM-DD HH:mm:ss');

export const modificationDate = (date: string) : moment.Duration =>
  moment.duration(moment(Date.now()).diff(moment(date)), 'milliseconds');
  // return `${duration.days()}d${duration.hours()}h${duration.minutes()}m${duration.seconds()}s`;

export const exportText = (fileData: string, filename: string): void => {
  const blob = new Blob([fileData], { type: 'application/txt' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  link.remove();
};

export const displayVersionName = (version: string): string => version.split('').join('.');

export const convertVersions = (versions: Array<string>): Array<GenericInfo> => versions.map((version) => (
  {
    id: version,
    name: displayVersionName(version),
  }));

export const getMaintenanceStatus = async (): Promise<boolean> => {
  const { maintenanceMode } = getConfig();
  try {
    const tmpMaintenance = await getMaintenanceMode();
    return tmpMaintenance;
  } catch (e) {
    logInfo('Failed to retrieve maintenance status', e);
  }
  return maintenanceMode;
};

export const getInitMessageInfo = async (): Promise<string> => {
  try {
    const tmpMessage = await getMessageInfo();
    return tmpMessage;
  } catch (e) {
    logInfo('Failed to retrieve message info', e);
  }
  return '';
};

export const isStringEmpty = (data: string): boolean => data.replace(/\s/g, '') === '';

export const rgbToHsl = (rgbStr: string): Array<number> => {
  const [r, g, b] = rgbStr.slice(4, -1).split(',').map(Number);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const cmin = Math.min(red, green, blue);
  const cmax = Math.max(red, green, blue);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) {
    h = 0;
  } else if (cmax === red) {
    h = ((green - blue) / delta) % 6;
  } else if (cmax === green) {
    h = (blue - red) / delta + 2;
  } else {
    h = (red - green) / delta + 4;
  }

  h = Math.round(h * 60);

  if (h < 0) {
    h += 360;
  }

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return [h, s, l];
};

export default {};