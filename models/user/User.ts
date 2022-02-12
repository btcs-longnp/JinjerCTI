interface User {
  id: string;
  name: string;
  agent: {
    sipAccount: string;
    sipPassword: string;
  };
}

export const newUser = (
  id: string,
  name: string,
  sipAccount: string,
  sipPassword: string
): User => {
  return {
    id,
    name,
    agent: {
      sipAccount,
      sipPassword,
    },
  };
};

export default User;
