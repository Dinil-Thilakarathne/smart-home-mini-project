import { BaseToast, ErrorToast, type ToastConfig } from "react-native-toast-message";

export const appToastConfig: ToastConfig = {
  success: (props) => <BaseToast {...props} style={{ borderLeftColor: "#176B4D", borderRadius: 16, borderLeftWidth: 4, minHeight: 64 }} contentContainerStyle={{ paddingHorizontal: 14 }} text1Style={{ color: "#132019", fontSize: 13, fontWeight: "800" }} text2Style={{ color: "#526057", fontSize: 12, lineHeight: 17 }} />,
  error: (props) => <ErrorToast {...props} style={{ borderLeftColor: "#B74737", borderRadius: 16, borderLeftWidth: 4, minHeight: 64 }} contentContainerStyle={{ paddingHorizontal: 14 }} text1Style={{ color: "#96382B", fontSize: 13, fontWeight: "800" }} text2Style={{ color: "#6E3A31", fontSize: 12, lineHeight: 17 }} />,
  info: (props) => <BaseToast {...props} style={{ borderLeftColor: "#2D6A9F", borderRadius: 16, borderLeftWidth: 4, minHeight: 64 }} contentContainerStyle={{ paddingHorizontal: 14 }} text1Style={{ color: "#245B87", fontSize: 13, fontWeight: "800" }} text2Style={{ color: "#3A5D78", fontSize: 12, lineHeight: 17 }} />,
};
