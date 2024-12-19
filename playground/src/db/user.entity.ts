interface User {
  id?: number,
  email: string,
  password: string,
  name: string,
}

const users: User[] = [];

export function* userGenerator() {
  let idCounter = 1;
  while (true) {
    const userData: Omit<User, "id"> = yield;
    const newUser = { id: idCounter++, ...userData };
    users.push(newUser);
    yield newUser.id;
  }
}