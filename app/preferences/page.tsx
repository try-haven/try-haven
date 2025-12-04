"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddressInput from "@/components/AddressInput";
import CommutePreference from "@/components/CommutePreference";
import { useUser } from "@/contexts/UserContext";

type CommuteOption = "car" | "public-transit" | "walk" | "bike";

function PreferencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updatePreferences, isLoggedIn, isManager } = useUser();
  const [step, setStep] = useState<"address" | "commute">("address");
  const [userAddress, setUserAddress] = useState<string>("");

  useEffect(() => {
    // Check for step query parameter
    const stepParam = searchParams.get("step");
    if (stepParam === "commute") {
      setStep("commute");
    }

    // Load current address from user preferences
    if (user?.preferences?.address) {
      setUserAddress(user.preferences.address);
    }
  }, [searchParams, user]);

  useEffect(() => {
    // Redirect to home if not logged in
    if (!isLoggedIn) {
      router.push("/");
    }
    // Managers don't need preferences - redirect to dashboard
    if (isManager) {
      router.push("/manager/dashboard");
    }
  }, [isLoggedIn, isManager, router]);

  // Don't render if not logged in or if user is a manager
  if (!isLoggedIn || isManager) {
    return null;
  }

  // For new users with no preferences, pass undefined instead of empty values
  // This prevents the confirmation dialog from showing on first setup
  const currentAddress = user?.preferences?.address;
  const currentCommuteOptions = user?.preferences?.commute;

  if (step === "address") {
    return (
      <AddressInput
        onNext={(address) => {
          setUserAddress(address);
          // Update preferences in user context (partially)
          updatePreferences({
            ...user?.preferences,
            address,
          });
          setStep("commute");
        }}
        onBack={() => router.push("/swipe")}
        initialAddress={currentAddress}
      />
    );
  }

  return (
    <CommutePreference
      onNext={(options: CommuteOption[]) => {
        // Update preferences in user context (complete)
        updatePreferences({
          address: userAddress || currentAddress || "",
          commute: options,
        });
        router.push("/swipe");
      }}
      onBack={() => setStep("address")}
      initialOptions={currentCommuteOptions}
    />
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreferencesContent />
    </Suspense>
  );
}

