import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

// Create a new user
app.post("/users/new", async (req: Request, res: Response) => {
  const { email, username, firstName, lastName, password } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({
          error: "UsernameAlreadyTaken",
          data: undefined,
          success: false,
        });
      }

      if (existingUser.email === email) {
        return res.status(409).json({
          error: "EmailAlreadyInUse",
          data: undefined,
          success: false,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: { email, username, firstName, lastName, password: hashedPassword },
    });

    return res
      .status(201)
      .json({ error: undefined, data: newUser, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "ServerError", data: undefined, success: false });
  }
});

// Edit a user
app.post("/users/edit/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { email, username, firstName, lastName, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ error: "UserNotFound", data: undefined, success: false });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { email, username, firstName, lastName, password: hashedPassword },
    });

    return res
      .status(200)
      .json({ error: undefined, data: updatedUser, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "ServerError", data: undefined, success: false });
  }
});

// Get a user by email
app.get("/users", async (req: Request, res: Response) => {
  const { email } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { email: String(email) },
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "UserNotFound", data: undefined, success: false });
    }

    return res
      .status(200)
      .json({ error: undefined, data: user, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "ServerError", data: undefined, success: false });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
