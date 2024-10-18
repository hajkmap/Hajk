import { ReactElement } from "react";
import STATIC_TYPE from "./types/static-type";

class StaticElement {
  public type!: STATIC_TYPE;
  public title?: string;
  public element?: ReactElement;
  public gridColumns? = 12;
  public kind? = "StaticElement";
}

export default StaticElement;
