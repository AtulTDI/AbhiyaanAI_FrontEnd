import { MaterialCommunityIcons } from "@expo/vector-icons";

export type VoterCategory = {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export const VOTER_CATEGORIES: VoterCategory[] = [
  { id: 0, title: "voter.filterCategories.all", description: "voter.filterCategories.allDesc", icon: "account-group" },
  { id: 8, title: "voter.filterCategories.surname", description: "voter.filterCategories.surnameDesc", icon: "format-letter-case" },
  { id: 10, title: "voter.filterCategories.age", description: "voter.filterCategories.ageDesc", icon: "format-list-numbered" },
  { id: 9, title: "voter.filterCategories.color", description: "voter.filterCategories.colorDesc", icon: "palette" },
  { id: 1, title: "voter.filterCategories.star", description: "voter.filterCategories.starDesc", icon: "star" },
  { id: 7, title: "voter.filterCategories.followup", description: "voter.filterCategories.followupDesc", icon: "account-alert" },
  { id: 2, title: "voter.filterCategories.verified", description: "voter.filterCategories.verifiedDesc", icon: "check-decagram" },
  { id: 3, title: "voter.filterCategories.unverified", description: "voter.filterCategories.unverifiedDesc", icon: "help-circle" },
  { id: 5, title: "voter.filterCategories.voted", description: "voter.filterCategories.votedDesc", icon: "thumb-up" },
  { id: 6, title: "voter.filterCategories.notVoted", description: "voter.filterCategories.notVotedDesc", icon: "thumb-down" },
  { id: 4, title: "voter.filterCategories.dead", description: "voter.filterCategories.deadDesc", icon: "cross" },
];
