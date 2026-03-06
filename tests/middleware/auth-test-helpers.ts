import type { AuthRequest } from "../../src/shared/types";

export const getTestReq = (returnValue: string | undefined) => {
  return {
    get: (_headerName: string) => {
      return returnValue;
    },
  } as AuthRequest;
};
