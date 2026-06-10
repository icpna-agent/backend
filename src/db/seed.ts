import { seedUsers } from "@/seeds/user.seed";

async function seed() {
    try {
        console.log("Seeding...\n");
        await seedUsers();
        console.log("Database seeded successfully...\n");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seed();