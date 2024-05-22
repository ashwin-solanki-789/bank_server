export const userResolver = {
  Query: {
    getUser: (_: any, args: any) => {
      let user = {
        id: args.id,
        firstname: "Some Name",
        tax_id: "111111",
        password: "aaaaa",
        join_date: "aaaaaa",
      };
      return user;
    },
  },
  Mutation: {
    login: (_: any, args: any) => {
      return;
    },
    register: (_: any, args: any) => {
      return;
    },
  },
};
