import type React from "react";
import { createButton } from "@gluestack-ui/core/button/creator";
import { ActivityIndicator, Pressable as NativePressable, Text as NativeText, View, type PressableProps, type TextProps } from "react-native";

const Root = (props: PressableProps & { isDisabled?: boolean }) => <NativePressable {...props} disabled={props.isDisabled || props.disabled} />;
const Label = (props: TextProps) => <NativeText {...props} />;
const Group = (props: { children?: React.ReactNode }) => <View {...props} />;
const Spinner = () => <ActivityIndicator />;
const Icon = (props: { children?: React.ReactNode }) => <View {...props} />;

export const Button = createButton({ Root, Text: Label, Group, Spinner, Icon });
export const ButtonText = Button.Text;
