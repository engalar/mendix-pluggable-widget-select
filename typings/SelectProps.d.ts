/**
 * This file was generated from Select.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, EditableValue, ListValue, ListActionValue, ListAttributeValue } from "mendix";
import { Big } from "big.js";

export interface SelectContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    showLabel: boolean;
    labelString: string;
    searchValue: EditableValue<string>;
    options: ListValue;
    optionValue: ListAttributeValue<string | Big>;
    optionLabel: ListAttributeValue<string>;
    selectList?: ListValue;
    optionValueM?: ListAttributeValue<string | Big>;
    value?: EditableValue<string>;
    onSelect?: ListActionValue;
    onDeselect?: ListActionValue;
    onDeselectM?: ListActionValue;
    isMultiConst: boolean;
    onCreate?: ActionValue;
}

export interface SelectPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    showLabel: boolean;
    labelString: string;
    searchValue: string;
    options: {} | { type: string } | null;
    optionValue: string;
    optionLabel: string;
    selectList: {} | { type: string } | null;
    optionValueM: string;
    value: string;
    onSelect: {} | null;
    onDeselect: {} | null;
    onDeselectM: {} | null;
    isMultiConst: boolean;
    onCreate: {} | null;
}
