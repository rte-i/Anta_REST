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

import { Box, Divider } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

/**
 * Types
 */

interface Props {
  header?: ReactNode;
  hideHeaderDivider?: boolean;
}

/**
 * Component
 */

function BasicPage(props: PropsWithChildren<Props>) {
  const { header, hideHeaderDivider, children } = props;

  return (
    <Box sx={{ height: 1, display: "flex", flexDirection: "column" }}>
      {header && (
        <Box sx={{ width: 1, py: 2, px: 3 }}>
          {header}
          {hideHeaderDivider ? null : <Divider />}
        </Box>
      )}
      {children}
    </Box>
  );
}

BasicPage.defaultProps = {
  header: null,
  hideHeaderDivider: false,
};

export default BasicPage;
