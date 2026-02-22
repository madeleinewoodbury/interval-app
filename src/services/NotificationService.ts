import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Simple notification service following Taskly pattern
export class NotificationService {
  private static currentNotificationId: string | undefined

  static async registerForPushNotifications(): Promise<Notifications.PermissionStatus | null> {
    // Configure notification channel for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("interval-timer", {
        name: "Interval Timer",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        showBadge: false,
      })
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync()
        return status
      } else {
        return existingStatus
      }
    } else {
      return null
    }
  }

  static async scheduleNextNotification(
    title: string,
    body: string,
    seconds: number,
  ): Promise<string | null> {
    // Cancel any existing notification first
    if (this.currentNotificationId) {
      await this.cancelCurrentNotification()
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true, // Let system handle sound for notifications
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, seconds),
          channelId: "interval-timer",
        },
      })

      this.currentNotificationId = notificationId
      console.log(`Scheduled notification: ${title} - ${body} in ${seconds}s`)
      return notificationId
    } catch (error) {
      console.error("Failed to schedule notification:", error)
      return null
    }
  }

  // Schedule multiple notifications at specific relative times (seconds from now)
  static async scheduleMultiple(
    entries: { title: string; body: string; seconds: number }[],
  ): Promise<string[]> {
    const ids: string[] = []
    for (const e of entries) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: e.title,
            body: e.body,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, Math.floor(e.seconds)),
            channelId: "interval-timer",
          },
        })
        ids.push(id)
      } catch (err) {
        console.error("Failed scheduling notification", e, err)
      }
    }
    // Track only last one as current for legacy API consistency
    if (ids.length) this.currentNotificationId = ids[ids.length - 1]
    return ids
  }

  static async cancelCurrentNotification() {
    if (this.currentNotificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          this.currentNotificationId,
        )
        console.log("Cancelled current notification")
        this.currentNotificationId = undefined
      } catch (error) {
        console.error("Failed to cancel current notification:", error)
      }
    }
  }

  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      this.currentNotificationId = undefined
      console.log("Cancelled all scheduled notifications")
    } catch (error) {
      console.error("Failed to cancel all notifications:", error)
    }
  }

  static hasActiveNotification(): boolean {
    return this.currentNotificationId !== undefined
  }
}
