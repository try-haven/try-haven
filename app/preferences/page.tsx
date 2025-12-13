"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddressInput from "@/components/AddressInput";
import CommutePreference from "@/components/CommutePreference";
import ApartmentPreferences from "@/components/ApartmentPreferences";
import { useUser } from "@/contexts/UserContext";

type CommuteOption = "car" | "public-transit" | "walk" | "bike";

function PreferencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updatePreferences, isLoggedIn, isManager } = useUser();
  const [step, setStep] = useState<"address" | "commute" | "apartment">("address");
  const [userAddress, setUserAddress] = useState<string>("");
  const [userCommute, setUserCommute] = useState<CommuteOption[]>([]);

  useEffect(() => {
    // Check for step query parameter
    const stepParam = searchParams.get("step");
    if (stepParam === "commute") {
      setStep("commute");
    } else if (stepParam === "apartment") {
      setStep("apartment");
    }

    // Load current address from user preferences
    if (user?.preferences?.address) {
      setUserAddress(user.preferences.address);
    }

    // Load current commute options from user preferences
    if (user?.preferences?.commute) {
      setUserCommute(user.preferences.commute);
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
  const currentApartmentPreferences = {
    priceMin: user?.preferences?.priceMin,
    priceMax: user?.preferences?.priceMax,
    bedroomsMin: user?.preferences?.bedroomsMin,
    bedroomsMax: user?.preferences?.bedroomsMax,
    bathroomsMin: user?.preferences?.bathroomsMin,
    bathroomsMax: user?.preferences?.bathroomsMax,
    minRating: user?.preferences?.minRating,
    weights: user?.preferences?.weights,
  };

  if (step === "address") {
    return (
      <AddressInput
        onNext={(address) => {
          setUserAddress(address);
          setStep("commute");
        }}
        onBack={() => router.push("/swipe")}
        initialAddress={currentAddress}
      />
    );
  }

  if (step === "commute") {
    return (
      <CommutePreference
        onNext={(options: CommuteOption[]) => {
          setUserCommute(options);
          setStep("apartment");
        }}
        onBack={() => setStep("address")}
        initialOptions={currentCommuteOptions}
      />
    );
  }

  return (
    <ApartmentPreferences
      onNext={(apartmentPrefs) => {
        // Update all preferences in user context
        updatePreferences({
          address: userAddress || currentAddress || "",
          commute: userCommute.length > 0 ? userCommute : currentCommuteOptions || [],
          priceMin: apartmentPrefs.priceMin,
          priceMax: apartmentPrefs.priceMax,
          bedroomsMin: apartmentPrefs.bedroomsMin,
          bedroomsMax: apartmentPrefs.bedroomsMax,
          bathroomsMin: apartmentPrefs.bathroomsMin,
          bathroomsMax: apartmentPrefs.bathroomsMax,
          minRating: apartmentPrefs.minRating,
          weights: apartmentPrefs.weights,
        });
        router.push("/swipe");
      }}
      onBack={() => setStep("commute")}
      initialPreferences={currentApartmentPreferences}
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

