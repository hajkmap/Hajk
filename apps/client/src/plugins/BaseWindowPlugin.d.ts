import * as React from "react";

export interface BaseWindowPluginProps {
  app: any;
  map: any;
  options: any;
  custom: any;
  type: string;
  children: React.ReactElement;
}

export default class BaseWindowPlugin extends React.PureComponent<BaseWindowPluginProps> {}

