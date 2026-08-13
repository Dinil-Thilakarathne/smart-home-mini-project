import { createPressable } from "@gluestack-ui/core/pressable/creator";
import { Pressable as NativePressable } from "react-native";

export const Pressable = createPressable({ Root: NativePressable });
