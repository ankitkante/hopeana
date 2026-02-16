"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Icon from "@mdi/react";
import { mdiAlertOutline } from "@mdi/js";
import DeactivateConfirmModal from "./components/DeactivateConfirmModal";

const profileSchema = yup.object({
  firstName: yup.string().max(50, "Max 50 characters").default(""),
  lastName: yup.string().max(50, "Max 50 characters").default(""),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    mode: "onBlur",
    defaultValues: { firstName: "", lastName: "" },
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error("Failed to load user");
        const data = await res.json();
        setUser(data.data);
        reset({
          firstName: data.data.firstName || "",
          lastName: data.data.lastName || "",
        });
      } catch {
        // Will show empty form
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [reset]);

  async function onSubmit(data: ProfileFormData) {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName || null,
          lastName: data.lastName || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const result = await res.json();
      setUser(result.data);
      reset({ firstName: result.data.firstName || "", lastName: result.data.lastName || "" });
      setSaveMessage({ type: "success", text: "Changes saved successfully." });
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save changes. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setIsDeactivating(true);
    try {
      const res = await fetch("/api/user/deactivate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to deactivate");
      router.push("/");
    } catch {
      setIsDeactivating(false);
      setShowDeactivateModal(false);
      setSaveMessage({ type: "error", text: "Failed to deactivate account. Please try again." });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Personal Information
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Update your personal details here.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
                First Name
              </label>
              <input
                type="text"
                {...register("firstName")}
                className={`w-full rounded-lg border bg-white dark:bg-gray-700 p-3 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.firstName
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:border-primary"
                }`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
                Last Name
              </label>
              <input
                type="text"
                {...register("lastName")}
                className={`w-full rounded-lg border bg-white dark:bg-gray-700 p-3 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.lastName
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:border-primary"
                }`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full sm:w-1/2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                saveMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => reset()}
              disabled={!isDirty || saving}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
        <div className="flex items-start gap-3">
          <Icon path={mdiAlertOutline} size={1} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Danger Zone
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Deactivate your account and pause all scheduled deliveries. Your data will be preserved.
            </p>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <DeactivateConfirmModal
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivateModal(false)}
          isDeactivating={isDeactivating}
        />
      )}
    </div>
  );
}
