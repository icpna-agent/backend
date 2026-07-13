import { database } from "@db/connection.db";
import { user, UserDto } from "@db/tables/user.table";
import { BCRYPT_NO_ROUNDS } from "@modules/auth/utils/auth.constants";
import * as Bcrypt from "bcrypt";

export async function seedUsers() {
    const users: UserDto[] = [
        {
            username: "santi",
            password: await Bcrypt.hash("abcdef", BCRYPT_NO_ROUNDS),
            phone: "951364862",
            mail: "abcdef@gmail.com",
        },
        {
            username: "ketchup" ,
            password: await Bcrypt.hash("halbird", BCRYPT_NO_ROUNDS),
            phone: "926358741",
            mail: "halbird@outlook.com",
        },
    ];
    
    await database
        .insert(user)
        .values(users)
        .onConflictDoNothing();

    console.log("✅ Users seeded");
    return users;
}
