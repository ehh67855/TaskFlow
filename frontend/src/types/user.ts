export interface UserData {
  firstName: string;
  lastName: string;
  login?: string;
  bio?: string | null;
  profilePicture?: string | null;
}

// "SELF" | "FRIENDS" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE" - see the backend's
// UserSummaryDto/UserProfileDto for what each means; kept as a plain string type (rather than
// a union) since it comes straight from the API and a typo there shouldn't be a type error here.
export type RelationshipStatus = string;

export interface UserSummary {
  login: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  relationshipStatus?: RelationshipStatus | null;
}

export interface FriendRequestData {
  id: number;
  sender: UserSummary;
  receiver: UserSummary;
  status: string;
  createdAt: string;
}

export interface UserProfileData {
  login: string;
  firstName: string;
  lastName: string;
  bio?: string | null;
  profilePicture?: string | null;
  friendCount: number;
  relationshipStatus: RelationshipStatus;
}
