import { NextRequest, NextResponse } from "next/server";
import {
  Transaction,
  PublicKey,
  SystemProgram,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
} from "@solana/actions";
import { connectToDatabase } from "../../../(mongo)/db";
import { customAlphabet } from "nanoid";
import { getCompletedAction, saveOrgData } from "../helper";
import OrgData from "@/app/(mongo)/OrgSchema";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const BARK_PUB_KEY = new PublicKey("2NTvEssJ2i998V2cMGT4Fy3JhyFnAzHFonDo9dbAkVrg");
const generateRandomId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 8);

export const GET = async (req: NextRequest) => {
  const payload: ActionGetResponse = {
    icon: "https://bark.blinks.vercel.app/logo.png",
    title: "Create your own subscription Blink",
    description: "Enter the details of your organization/business/project to create a blink",
    label: "Create One",
    links: {
      actions: [
        {
          label: "Create One",
          href: "/api/actions/create?name={name}&email={email}&month={month}&year={year}",
          parameters: [
            { type: "text", name: "name", label: "Enter Name", required: true },
            { type: "email", name: "email", label: "Enter Email", required: true },
            { type: "number", name: "month", label: "Enter Monthly Price", required: true },
            { type: "number", name: "year", label: "Enter Yearly Price", required: true },
          ],
        },
      ],
    },
    type: "action",
  };

  return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS });
};

// Add OPTIONS handler for CORS
export const OPTIONS = GET;

export const POST = async (req: NextRequest) => {
  try {
    await connectToDatabase();

    const body = (await req.json()) as { account: string; signature: string };
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") ?? "";
    const email = searchParams.get("email") ?? "";
    const month = parseFloat(searchParams.get("month") ?? "0");
    const year = parseFloat(searchParams.get("year") ?? "0");
    const randomId = generateRandomId();
    const orgKey = body.account;
    const orgPubKey = new PublicKey(orgKey);
    const stage = searchParams.get("stage");

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: orgPubKey,
        toPubkey: BARK_PUB_KEY,
        lamports: 10000000 / 2, // Example value, ensure this is appropriate
      })
    );

    transaction.feePayer = orgPubKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    if (stage) {
      const newBlink = new OrgData({
        org: randomId,
        name,
        email,
        month,
        year,
        orgPubKey,
      });

      await newBlink.save();

      return NextResponse.json(
        await createPostResponse({
          fields: {
            links: {
              next: getCompletedAction(randomId),
            },
            transaction,
            message: `Blink created`,
          },
        }),
        { headers: ACTIONS_CORS_HEADERS }
      );
    }

    const nextActionLink = await saveOrgData(name, email, month, year, orgKey);

    const payload = await createPostResponse({
      fields: {
        transaction,
        message: "Please sign the transaction to complete the process.",
        links: {
          next: nextActionLink,
        },
      },
    });

    return new Response(JSON.stringify(payload), { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    console.error("Error processing POST request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
};
