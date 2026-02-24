import type { Theme } from "./theme.js";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation
  export interface DefaultTheme extends Theme {}
}
