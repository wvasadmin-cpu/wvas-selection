// Field names in the master membership table, written by the associate
// membership form (/join). This site never reads the members table.

export const MEMBER_FIELDS = {
  firstName: "First Name",
  surname: "Surname",
  address: "Address",
  phone: "Phone",
  mobile: "Mobile",
  email: "Email",
  membershipType: "Membership Type",
  newAssociate: "New Associate Membership",
  dateJoined: "Date Joined",
  notes: "Notes",
} as const;

export const ASSOCIATE_TYPE = "Associate";
export const NEW_ASSOCIATE_FLAG = "New Associate Membership Application";
