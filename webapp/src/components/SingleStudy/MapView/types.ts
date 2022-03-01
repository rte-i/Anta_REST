export interface NodeProperties {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    rgbColor: Array<number>;
    size: { width: number; height: number };
    highlighted?: boolean;
}

export interface LinkSynthesis {
    [index: string]: object;
}

export interface AreasSynthesis {
    name: string;
    links: LinkSynthesis;
    thermals: string;
    renewables: Array<string>;
    // eslint-disable-next-line camelcase
    filters_synthesis: Array<string>;
    // eslint-disable-next-line camelcase
    filters_year: Array<string>;
}

export interface AreasNameSynthesis {
    [index: string]: AreasSynthesis;
}

export interface StudyProperties {
    archiveInputSeries: Array<string>;
    areas: AreasNameSynthesis;
    bindings: Array<string>;
    enrModelling: string;
    outputPath: string;
    outputs: string;
    path: string;
    sets: string;
    storeNewSet: boolean;
    studyId: string;
    studyPath: string;
    version: number;
}

export interface LinkProperties {
    source: string;
    target: string;
}

export interface AreaLayerColor {
    [key: number]: string;
}
export interface AreaLayerXandY {
    [key: number]: string;
}

export interface AreaUI {
    id: string;
    // eslint-disable-next-line camelcase
    color_b: number;
    // eslint-disable-next-line camelcase
    color_g: number;
    // eslint-disable-next-line camelcase
    color_r: number;
    layers: string;
    x: number;
    y: number;
}

export interface SingleAreaConfig {
    layerColor: AreaLayerColor;
    layerX: AreaLayerXandY;
    layerY: AreaLayerXandY;
    ui: AreaUI;
}

export interface AreasConfig {
    [index: string]: SingleAreaConfig;
}

export interface UpdateAreaUi {
    x: number;
    y: number;
    // eslint-disable-next-line camelcase
    color_rgb: Array<number>;
}

export interface LinkCreationInfo {
    area1: string;
    area2: string;
}

export interface AreaCreationDTO {
    name: string;
    type: object;
    metadata?: object;
    set?: Array<string>;
}

export interface AreaInfoDTO extends AreaCreationDTO {
    id: string;
    thermals: Array<object>;
}

export const isNode = (el: NodeProperties | LinkProperties): boolean => (el as any).id !== undefined;

export default {};