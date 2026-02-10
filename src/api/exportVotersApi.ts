import { Platform } from "react-native";
import axios from "./axiosInstance";

/**
 * Export voters list as PDF
 */
export const exportVotersPdf = (
  type: number,
  surname?: string,
  supportColor?: string,
  age?: string,
  gender?: string,
  casteId?: string,
  booth?: string
) =>
  axios.post("/ExportVoters/export-voters", {}, {
    useApiPrefix: true,
    useVoterBase: true,
    responseType: Platform.OS === "web" ? "blob" : "arraybuffer",
    params: {
      type,
      ...(surname ? { surname } : {}),
      ...(supportColor ? { supportColor } : {}),
      ...(age ? { age } : {}),
      ...(gender ? { gender } : {}),
      ...(casteId ? { casteId } : {}),
      ...(booth ? { booth } : {}),
    },
  });
