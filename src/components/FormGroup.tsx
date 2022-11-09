import { ReactElement } from "react";

export interface HelloWorldSampleProps {
    children?: React.ReactNode;
    label?: string;
    isShowLabel: boolean;
}

export const FormGroup = (props: HelloWorldSampleProps): ReactElement => {
    return props.isShowLabel ? (
        <div className="mxcn-select form-group">
            <label className="control-label col-sm-3">{props.label}</label>
            <div className="col-sm-9">{props.children}</div>
        </div>
    ) : (
        <div className="mxcn-select form-group no-columns">{props.children}</div>
    );
};
