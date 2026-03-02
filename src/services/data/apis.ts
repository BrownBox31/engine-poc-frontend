export const ApiEndpoints = {
  LOGIN: "/auth/login",
  REFRESH_TOKEN: "/auth/refresh-token",
  ALL_INSPECTIONS: "/inspection/all",
  CREATE_GROUP_INSPECTION:
    "inspection/create-group-inspection" /** @see ICreateGroupInspection */,
  CREATE_SINGLE_INSPECTION:
    "inspection/create/" /** @see ICreateSingleInspection */,
  INSPECTION_DETAILS: "resolution/issues/v2/vin/", //Put API where the VIN is appended to the end of the URL
  UPDATE_ISSUE_STATUS:
    "resolution/issues/" /** @see IUpdateIssueStatus @append VinId */,
  CREATE_MODEL: "model/create" /** @see ICreateModel */,
  CREATE_MODEL_CHECKLIST: "checklist/create" /** @see ICreateModelChecklist */,
  CREATE_MODEL_VIN_MAP: "model/create-multiple-model-vin-map/",
  FETCH_CHECLIST: "checklist/" /** @append /VIN @append View= */,
  CREATE_WORKLINE: "workline/create" /** @see ICreateWorkline */,
  CREATE_RESOLUTION: '/resolution/create/issue',
  DELETE_RESOLUTION_ISSUE: '/resolution/',
  ANALYTICS_COMMENT_COUNTS: '/analytics/comment-counts',
  ANALYTICS_COMMENT_COUNTS_ALL: '/analytics/comment-counts/all',
  ANALYTICS_DEFECT_COUNTS: '/analytics/defect-counts',
  REWORK_STATIONS: '/rework-stations',
  CREATE_INSPECTION: '/inspection/create-inspection',
 UPDATE_ISSUE_REWORK_STATION: '/resolution/issues/',
 PV_INSPECTION_BY_VIN: '/pvinspection/',
} as const;
