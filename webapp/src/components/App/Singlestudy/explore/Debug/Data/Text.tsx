import { useTranslation } from "react-i18next";
import { Box, useTheme } from "@mui/material";
import { getStudyData } from "../../../../../../services/api/study";
import usePromiseWithSnackbarError from "../../../../../../hooks/usePromiseWithSnackbarError";
import UsePromiseCond from "../../../../../common/utils/UsePromiseCond";
import ViewWrapper from "../../../../../common/page/ViewWrapper";
import {
  Light as SyntaxHighlighter,
  type SyntaxHighlighterProps,
} from "react-syntax-highlighter";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import plaintext from "react-syntax-highlighter/dist/esm/languages/hljs/plaintext";
import ini from "react-syntax-highlighter/dist/esm/languages/hljs/ini";
import properties from "react-syntax-highlighter/dist/esm/languages/hljs/properties";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("xml", xml);
SyntaxHighlighter.registerLanguage("plaintext", plaintext);
SyntaxHighlighter.registerLanguage("ini", ini);
SyntaxHighlighter.registerLanguage("properties", properties);

// Ex: "[2024-05-21 17:18:57][solver][check]"
const logsRegex = /^(\[[^\]]*\]){3}/;
// Ex: "EXP : 0"
const propertiesRegex = /^[^:]+ : [^:]+/;

interface Props {
  studyId: string;
  path: string;
}

function getSyntaxProps(data: string | string[]): SyntaxHighlighterProps {
  const isArray = Array.isArray(data);
  const text = isArray ? data.join("\n") : data;

  return {
    children: text,
    showLineNumbers: isArray,
    language: (() => {
      const firstLine = text.split("\n")[0];
      if (firstLine.startsWith("<?xml")) {
        return "xml";
      } else if (logsRegex.test(firstLine)) {
        return "ini";
      } else if (propertiesRegex.test(firstLine)) {
        return "properties";
      }
      return "plaintext";
    })(),
  };
}

function Text({ studyId, path }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const res = usePromiseWithSnackbarError(
    () => getStudyData<string>(studyId, path),
    {
      errorMessage: t("studies.error.retrieveData"),
      deps: [studyId, path],
    },
  );

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <ViewWrapper>
      <UsePromiseCond
        response={res}
        ifResolved={(data) => (
          <Box sx={{ height: 1, display: "flex", flexDirection: "column" }}>
            <SyntaxHighlighter
              style={atomOneDark}
              lineNumberStyle={{
                opacity: 0.5,
                paddingRight: theme.spacing(3),
              }}
              customStyle={{
                margin: 0,
                overflow: "auto",
                padding: theme.spacing(2),
                borderRadius: theme.shape.borderRadius,
                fontSize: theme.typography.body2.fontSize,
              }}
              {...getSyntaxProps(data)}
            />
          </Box>
        )}
      />
    </ViewWrapper>
  );
}

export default Text;
