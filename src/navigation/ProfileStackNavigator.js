import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { stackScreenDark } from "../theme";
import ProfileHubScreen from "../screens/ProfileHubScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import ProfileShippingScreen from "../screens/ProfileShippingScreen";
import ProfilePublicViewScreen from "../screens/ProfilePublicViewScreen";
import ProfileLegalScreen from "../screens/ProfileLegalScreen";
import ProfileDeleteAccountScreen from "../screens/ProfileDeleteAccountScreen";
import ProfileSupportScreen from "../screens/ProfileSupportScreen";
import SupportTicketNewScreen from "../screens/SupportTicketNewScreen";
import SupportTicketDetailScreen from "../screens/SupportTicketDetailScreen";
import AdminPanelScreen from "../screens/AdminPanelScreen";
import AdminSupportListScreen from "../screens/AdminSupportListScreen";
import AdminSupportDetailScreen from "../screens/AdminSupportDetailScreen";
import AdminReportsListScreen from "../screens/AdminReportsListScreen";
import AdminReportDetailScreen from "../screens/AdminReportDetailScreen";
import DealsListScreen from "../screens/DealsListScreen";
import DealDetailScreen from "../screens/DealDetailScreen";

const ProfileStack = createNativeStackNavigator();

export function ProfileStackNavigator() {
  const { t } = useTranslation();
  return (
    <ProfileStack.Navigator screenOptions={stackScreenDark}>
      <ProfileStack.Screen
        name="ProfileHub"
        component={ProfileHubScreen}
        options={{ title: t("profile.title") }}
      />
      <ProfileStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: t("profile.menuEditProfile") }}
      />
      <ProfileStack.Screen
        name="ProfileShipping"
        component={ProfileShippingScreen}
        options={{ title: t("profile.tradeSection") }}
      />
      <ProfileStack.Screen
        name="DealsList"
        component={DealsListScreen}
        options={{ title: t("deals.title") }}
      />
      <ProfileStack.Screen
        name="DealDetail"
        component={DealDetailScreen}
        options={{ title: t("deals.title") }}
      />
      <ProfileStack.Screen
        name="ProfilePublicUser"
        component={ProfilePublicViewScreen}
        options={{ title: t("profile.publicPreviewTitle") }}
      />
      <ProfileStack.Screen
        name="ProfileLegal"
        component={ProfileLegalScreen}
        options={({ route }) => ({
          title:
            route.params?.kind &&
            ["imprint", "terms", "privacy"].includes(route.params.kind)
              ? t(`profile.legal.${route.params.kind}.title`)
              : t("profile.title"),
        })}
      />
      <ProfileStack.Screen
        name="ProfileDeleteAccount"
        component={ProfileDeleteAccountScreen}
        options={{ title: t("profile.deleteAccountTitle") }}
      />
      <ProfileStack.Screen
        name="ProfileSupport"
        component={ProfileSupportScreen}
        options={{ title: t("support.hubTitle") }}
      />
      <ProfileStack.Screen
        name="ProfileSupportNew"
        component={SupportTicketNewScreen}
        options={{ title: t("support.newTicket") }}
      />
      <ProfileStack.Screen
        name="ProfileSupportDetail"
        component={SupportTicketDetailScreen}
        options={{ title: t("support.detailTitle") }}
      />
      <ProfileStack.Screen
        name="AdminPanel"
        component={AdminPanelScreen}
        options={{ title: t("admin.title") }}
      />
      <ProfileStack.Screen
        name="AdminSupportList"
        component={AdminSupportListScreen}
        options={{ title: t("admin.supportListTitle") }}
      />
      <ProfileStack.Screen
        name="AdminReportsList"
        component={AdminReportsListScreen}
        options={{ title: t("admin.reportsListTitle") }}
      />
      <ProfileStack.Screen
        name="AdminReportDetail"
        component={AdminReportDetailScreen}
        options={{ title: t("admin.reportsListTitle") }}
      />
      <ProfileStack.Screen
        name="AdminSupportDetail"
        component={AdminSupportDetailScreen}
        options={{ title: t("support.detailTitle") }}
      />
    </ProfileStack.Navigator>
  );
}
