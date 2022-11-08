import { useCallback, useEffect, useMemo, useState } from "react";
import { ValueStatus } from "mendix";
import { attribute, literal, contains } from "mendix/filters/builders";
import { Button, Select } from "antd";

import { SelectContainerProps } from "../typings/SelectProps";

import "./ui/index.scss";
import { useDebounceFn, useInterval, useMount, usePrevious } from "ahooks";
import { FormGroup } from "./components/FormGroup";

const LOADING_STRING = "_-_";
const PAGE_SIZE = 50;
const POLLING_TIME = 100;
export interface SelectOption {
    label: string;
    value: string;
}
export default function (props: SelectContainerProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [value, setValue] = useState<string | string[]>();
    const [searchValue, setSearchValue] = useState<string>("");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const [onCreateLoading, setOnCreateLoading] = useState(false);
    const [interval, setInterval] = useState<number>();

    const options = useMemo(() => {
        if (props.options.status === ValueStatus.Available) {
            const loadingOption: SelectOption = { value: LOADING_STRING, label: "加载中。。。" };

            const page = props.options.items?.map<SelectOption>(item => ({
                label: props.optionLabel.get(item).value!,
                id: item.id,
                value: props.optionValue.get(item).value!.toString()
            }));

            const existOption = page?.some(d => d.value === searchValue);
            setShowCreate((existOption === undefined ? false : !existOption) && !!searchValue);

            const leftOptions = Array(props.options.offset).fill(loadingOption);

            const rightOptions = Array(
                props.options.totalCount! - props.options.items!.length - props.options.offset
            ).fill(loadingOption);

            return leftOptions
                .concat(page)
                .concat(rightOptions)
                .map((v, i) => {
                    if (v.value === LOADING_STRING) {
                        return { label: v.label, value: LOADING_STRING + i.toString(), disabled: true };
                    } else {
                        return v;
                    }
                });
        }
    }, [props.options]);
    const preOptions = usePrevious(options);

    const onChange = useCallback(
        (value: string) => {
            if (props.isMultiConst) {
                return;
            }
            const selectedObjectItem = props.options.items?.find(d => d.id === value);
            if (selectedObjectItem) {
                if (props.value && props.value.status === ValueStatus.Available) {
                    props.value.setValue(props.optionValue.get(selectedObjectItem).value?.toString());
                }
                if (props.onSelect && props.options.status === ValueStatus.Available) {
                    props.onSelect?.get(selectedObjectItem).execute();
                }
            }
        },
        [props.value, props.options]
    );

    const onCreate = useCallback(
        (value: string) => {
            if (props.onCreate?.canExecute) {
                props.searchValue?.setValue(value);
                props.onCreate?.execute();
            }
        },
        [props.onCreate]
    );

    const { run } = useDebounceFn(
        (offset, _) => {
            if (offset < props.options.offset || offset + 8 > props.options.offset + props.options.items!.length) {
                props.options.setOffset(Math.max(0, offset - 1));
            }
        },
        { wait: 300 }
    );

    useEffect(() => {
        if (
            !searchValue /* 搜索中不应该变更值，以免失去输入焦点*/ &&
            props.isMultiConst &&
            props.selectList &&
            props.optionValueM
        ) {
            if (
                props.selectList &&
                props.selectList.status === ValueStatus.Available &&
                props.onDeselectM !== undefined
            ) {
                const listValue = props.selectList.items?.map(obj => props.optionValueM!.get(obj).value!.toString());
                setValue(listValue ?? []);
                props.value?.setValue((listValue ?? []).join(","));
            }
        }
    }, [props.selectList]);

    useEffect(() => {
        if (props.value && props.value.status === ValueStatus.Available) {
            if (props.isMultiConst) {
                if (props.onDeselectM === undefined) {
                    if (props.value.value) {
                        setValue(props.value.value?.split(","));
                    } else {
                        setValue([]);
                    }
                }
            } else {
                setValue(props.value.value);
            }
        }
    }, [props.value]);

    useEffect(() => {
        props.options.setOffset(0);
        if (searchValue) {
            const attrStr = attribute(props.optionValue.id);
            const subStr = literal(searchValue);
            const filterCondition1 = contains(attrStr, subStr);

            props.options.setFilter(filterCondition1);
        } else {
            props.options.setFilter(undefined);
        }
        props.options.reload();
    }, [searchValue]);

    useEffect(() => {
        setOnCreateLoading(props.onCreate?.isExecuting ?? false);
    }, [props.onCreate]);

    useInterval(
        () => {
            if (props.selectList?.status === ValueStatus.Available) {
                const obj = props.selectList.items![0];
                if (obj) {
                    props.onDeselectM?.get(obj).execute();
                } else {
                    setInterval(undefined);
                }
            }
            if (!props.selectList) {
                props.value?.setValue(undefined);
                setValue(undefined);
                setInterval(undefined);
            }
        },
        interval,
        { immediate: true }
    );

    useMount(() => {
        props.options.setLimit(PAGE_SIZE);
        props.options.requestTotalCount(true);
    });

    return (
        <FormGroup label={props.labelString} isShowLabel={props.showLabel}>
            <Select
            loading={props.options.status === ValueStatus.Loading}
            className="mxcn-select form-control"
            allowClear
            maxTagCount="responsive"
            open={open}
            value={value}
            listItemHeight={32}
            onChange={onChange}
            onSelect={(_value: any, option: any) => {
                const obj = props.options?.items?.find(d => d.id === option.id);
                if (obj) {
                    props.onSelect?.get(obj).execute();
                }
                if (!props.isMultiConst) {
                    props.value?.setValue(_value);
                } else {
                    if (!props.onSelect && props.value && props.value.value !== undefined) {
                        if (props.value.value === "") {
                            props.value.setValue(_value);
                        } else {
                            const os = props.value.value.split(",");
                            if (os.indexOf(_value) === -1) {
                                props.value.setValue(`${props.value.value},${_value}`);
                            }
                        }
                    }
                }
            }}
            onDeselect={(_value: any, option: any) => {
                const obj = props.selectList?.items?.find(d => d.id === option.id);
                if (obj) {
                    props.onDeselectM?.get(obj).execute();
                }
                if (props.isMultiConst && !props.onDeselectM && props.value && props.value.value) {
                    const os = props.value.value.split(",");
                    const newValue = os.filter(d => d !== _value).join(",");
                    props.value.setValue(newValue);
                }
            }}
            onClear={() => {
                if (props.isMultiConst) {
                    setInterval(POLLING_TIME);
                } else {
                    const obj = props.options?.items?.find(d => props.optionValue.get(d).value === props.value?.value);
                    if (obj) {
                        props.onDeselect?.get(obj).execute();
                    }
                }
                props.value?.setTextValue("");
                setSearchValue("");
            }}
            onDropdownVisibleChange={o => {
                if (!o) {
                    setSearchValue("");
                }
                setOpen(o);
                setDropdownVisible(o);
            }}
            onPopupScroll={e => {
                run(Math.floor(e.currentTarget.scrollTop / 32), e.currentTarget.clientHeight / 32);
            }}
            mode={props.isMultiConst ? "multiple" : undefined}
            options={dropdownVisible ? options ?? preOptions : options}
            onSearch={setSearchValue}
            showSearch
            dropdownRender={menu => (
                <div className="mxcn-select-dropdown">
                    {menu}
                    {showCreate ? (
                        <div aria-selected="false" className="ant-select-item ant-select-item-option">
                            <div className="ant-select-item-option-content">
                                <Button
                                    loading={onCreateLoading}
                                    block
                                    type="text"
                                    onClick={() => {
                                        onCreate(searchValue);
                                    }}
                                >
                                    创建并选择&nbsp;
                                    <span title={searchValue} className="on-create-text">
                                        {searchValue}
                                    </span>
                                </Button>
                            </div>
                            <span
                                className="ant-select-item-option-state"
                                unselectable="on"
                                aria-hidden="true"
                                style={{ userSelect: "none" }}
                            ></span>
                        </div>
                    ) : null}
                </div>
            )}
        ></Select>
        </FormGroup>
    );
}
