export type Seat = "EXPERT" | "DESK";
export type PackageTier = "FREE" | "SILVER" | "GOLD" | "PLATINUM";

export type ProfilePiece = {
  key: "name" | "work" | "photo" | "place" | "payout";
  label: string;
  done: boolean;
};

export type PublicAccount = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  work: string | null;
  languages: string[];
  uiLanguage: string;
  country: string;
  currency: string;
  package: PackageTier;
  seat: Seat;
  placeLabel: string | null;
  photoUrl: string | null;
  payoutAccountSet: boolean;
  referralCode: string | null;
  referredById: string | null;
  rating: number;
  ratingCount: number;
  fingerprintEnrolled: boolean;
  faceEnrolled: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  hasGoogle: boolean;
  hasFacebook: boolean;
  hasPassword: boolean;
  hasWebAuthn: boolean;
  profilePercent: number;
  profileDoneCount: number;
  profilePieces: ProfilePiece[];
  latitude?: number | null;
  longitude?: number | null;
};

export type AuthResponse = {
  success: boolean;
  message?: string;
  data?: {
    account: PublicAccount;
    /** Persisted in localStorage for Bearer / Socket — never document.cookie */
    accessToken?: string;
    refreshToken?: string;
  };
  error?: { code: string; message: string };
};
