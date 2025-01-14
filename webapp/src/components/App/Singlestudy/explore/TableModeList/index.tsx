/**
 * Copyright (c) 2024, RTE (https://www.rte-france.com)
 *
 * See AUTHORS.txt
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This file is part of the Antares project.
 */

import { useState } from "react";
import { MenuItem } from "@mui/material";
import { useOutletContext } from "react-router";
import { useUpdateEffect } from "react-use";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import PropertiesView from "../../../../common/PropertiesView";
import ListElement from "../common/ListElement";
import type { TableTemplate } from "./utils";
import storage, {
  StorageKey,
} from "../../../../../services/utils/localStorage";
import { StudyMetadata } from "../../../../../common/types";
import CreateTemplateTableDialog from "./dialogs/CreateTemplateTableDialog";
import UpdateTemplateTableDialog from "./dialogs/UpdateTemplateTableDialog";
import ConfirmationDialog from "../../../../common/dialogs/ConfirmationDialog";
import TableMode from "../../../../common/TableMode";
import SplitView from "../../../../common/SplitView";
import ViewWrapper from "../../../../common/page/ViewWrapper";

function TableModeList() {
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<TableTemplate[]>(() => {
    const list =
      storage.getItem(StorageKey.StudiesModelTableModeTemplates) || [];
    return list.map((tp) => ({ ...tp, id: uuidv4() }));
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<
    TableTemplate["id"] | undefined
  >(templates[0]?.id);

  const [dialog, setDialog] = useState<{
    type: "add" | "edit" | "delete";
    templateId: TableTemplate["id"];
  } | null>(null);

  const { study } = useOutletContext<{ study: StudyMetadata }>();
  const selectedTemplate = templates.find((tp) => tp.id === selectedTemplateId);
  const dialogTemplate =
    dialog && templates.find((tp) => tp.id === dialog.templateId);

  // Update local storage
  useUpdateEffect(() => {
    storage.setItem(
      StorageKey.StudiesModelTableModeTemplates,
      templates
        // It is useless to keep template ids in local storage
        .map(({ id, ...rest }) => rest),
    );
  }, [templates]);

  ////////////////////////////////////////////////////////////////
  // Utils
  ////////////////////////////////////////////////////////////////

  const closeDialog = () => setDialog(null);

  ////////////////////////////////////////////////////////////////
  // Event Handlers
  ////////////////////////////////////////////////////////////////

  const handleDeleteTemplate = () => {
    setTemplates((templates) =>
      templates.filter((tp) => tp.id !== dialog?.templateId),
    );
    closeDialog();
  };

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <>
      <SplitView id="tablemode" sizes={[10, 90]}>
        {/* Left */}
        <PropertiesView
          mainContent={
            <ListElement
              list={templates}
              currentElement={selectedTemplate?.id}
              currentElementKeyToTest="id"
              setSelectedItem={({ id }) => setSelectedTemplateId(id)}
              contextMenuContent={({ element, close }) => (
                <>
                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      setDialog({
                        type: "edit",
                        templateId: element.id,
                      });
                      close();
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      setDialog({
                        type: "delete",
                        templateId: element.id,
                      });
                      close();
                    }}
                  >
                    Delete
                  </MenuItem>
                </>
              )}
            />
          }
          onAdd={() => setDialog({ type: "add", templateId: "" })}
        />
        {/* Right */}
        <ViewWrapper>
          {selectedTemplate && (
            <TableMode
              studyId={study.id}
              type={selectedTemplate.type}
              columns={selectedTemplate.columns}
            />
          )}
        </ViewWrapper>
      </SplitView>
      {dialog?.type === "add" && (
        <CreateTemplateTableDialog
          templates={templates}
          setTemplates={setTemplates}
          onCancel={closeDialog}
          open
        />
      )}
      {dialog?.type === "edit" && dialogTemplate && (
        <UpdateTemplateTableDialog
          defaultValues={dialogTemplate}
          templates={templates}
          setTemplates={setTemplates}
          onCancel={closeDialog}
          open
        />
      )}
      {dialog?.type === "delete" && dialogTemplate && (
        <ConfirmationDialog
          titleIcon={DeleteIcon}
          alert="warning"
          onConfirm={handleDeleteTemplate}
          onCancel={closeDialog}
          open
        >
          {t("study.tableMode.dialog.delete.text", {
            name: dialogTemplate.name,
          })}
        </ConfirmationDialog>
      )}
    </>
  );
}

export default TableModeList;
