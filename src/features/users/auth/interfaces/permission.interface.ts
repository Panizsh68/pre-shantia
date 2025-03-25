import { Action } from "../enums/actions.enum";
import { Resource } from "../enums/resources.enum";

export interface Permission {
    action: Action;
    resource: Resource;
  }