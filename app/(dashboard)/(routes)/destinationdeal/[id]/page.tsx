import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { cbPicks, cbPick } from "./index.js";
import { InfoIcon, DollarSign, Calendar } from "lucide-react";
import Image from "next/image.js";
import { shipLogos } from "@/app/utils/shiplogos.ts";
import pexelmachine from "@/app/utils/CommonObjects/pexelmachine";
import { getGoogleImage } from "@/app/utils/CommonObjects/googleimage";
import { aiAssistBackOff } from "@/app/utils/api";
import { Container1Header } from "@/components/containers/container1";
import { CBPickData } from "@/components/cb/cbdestinationpickstile.jsx";
import { CleanText } from "@/app/utils/CleanText.js";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Pi } from "lucide-react";
import Link from "next/link.js";
//import { type } from "os";

interface ItineraryItem {
  day: string;
  port: string;
  portImage?: string;
}

interface PickPageComponentProps {
  title?: string; ///a creative title for this trip
  subtitle?: string; /// supporting text for the title
  mainImage?: string; ///a search term for a main image
  mainImageAlt?: string; ///alt text for the main image
  bodyText?: string; ///write an attractive description of the deal including the ship, itinerary, and ports of call along with any special features and amenities using around 200 words.
  featuresText?: [string]; ///list special excursions, dining specials, onboard credits, etc.
  itinerary?: [ItineraryItem]; ///list the ports of call if possible and the days of the week they are visited if possible
}
export interface gptTask {
  task: string;
  instruction: string;
}
let thisPick: any = {};
let thisData: string = "";

const gptTasks: gptTask[] = [
  {
    task: "title",
    instruction: "write a creative title for this trip in one sentence",
  },
  {
    task: "subtitle",
    instruction:
      "write a subtitle for this deal. form your response as answer only",
  },
  {
    task: "mainImage",
    instruction:
      "In 3 to 6 words (the name of ship is considered 1 word), what is the name of the ship in this deal? Only use the name of cruise line and name of ship. (example: Royal Caribbean Symphony Of The Seas) ",
  },
  {
    task: "mainImageAlt",
    instruction: "write the alt text for the main image in 6 words or less",
  },
  {
    task: "bodyText",
    instruction:
      "write the body of an article about this deal using around 200 words. form your response as answer only without initial explanation.",
  },
  {
    task: "featuresText",
    instruction:
      "Locate and list any special highlights that are exclusive to this deal if they are mentioned in the text. This can be special pricing, drink and/or dining specials, bonuses, and onboard credits. If no exclusive offers are mentioned just write a dash only. ",
  },
  {
    task: "itinerary",
    instruction:
      "list the ports of call if possible and the days of the week they are visited if possible. form your response as answer only and dont mention it if some info is not there",
  },
  {
    task: "price",
    instruction:
      "using one word and numbers/symbols only, write the price of the deal, per-person, in dollars. (example: $1,234)",
  },
  {
    task: "tripLength",
    instruction:
      "In 2 words, write the length of this trip. (example: 7 nights)",
  },
];
async function createPageOBJ(id: string) {
  console.log("id = ", id);
  const decodedURI = decodeURIComponent(
    id.replaceAll("%C3%82%C2%A0", "%C2%A0").replaceAll("%C4%80%C2%A0", "%C2%A0")
  );
  console.log("decodedURI = ", decodedURI);
  const pick = await cbPick(decodedURI);

  console.log("(PAGE):pick = ", pick);
  thisPick = pick;
  const result: any = {};
  const dataText = JSON.stringify(pick);
  thisData = dataText;
  for (let task of gptTasks) {
    const response = await aiAssistBackOff(
      task.instruction,
      CleanText(dataText),
      "destinationdeal" + pick.id,
      task.task,
      "", //task.task //use to delete first //task.task == 'bodyText' ? task.task : ''
      false
    );
    //console.log("response = ", response);
    result[task.task] = response;
  }

  return result;
}
async function getData(id: string) {
  let data: any = {};
  //const data1 = await cbPicks();
  const res = await createPageOBJ(id);

  console.log("res = ", res);
  //return { props: { data:'data' }}
  return res;
}
export default async function DestinationDealPage({ params: { id } }: any) {
  console.log(id);
  const data = await getData(id);

  const allPicks = await cbPicks();
  console.log("allPicks = ", allPicks);

  // console.log(CleanText(thisData))
  // console.log("Pick = ", thisPick)
  //await cbPick()
  // console.log('image query = ', data.mainImage)
  // const images = await getGoogleImage(data.mainImage, 2);
  // console.log("images = ", images);
  //  return <></>
  if (thisPick.img !== "") {
    data.featuredImage = thisPick.img;
  } else {
    try {
      const images = await getGoogleImage(data.mainImage, 2);
      if (images.length > 0) {
        console.log("images = ", images);
        const img = images[0];
        data.featuredImage = img.url;
      } else {
        const images = await pexelmachine(1, "cruise ship");
        data.featuredImage = images[0].srcOriginal;
      }
    } catch (error) {
      const images = await pexelmachine(1, "cruise ship");
      data.featuredImage = images[0].srcOriginal;
    }
  }

  console.log("data = ", data);

  // if (!data.bodyText) {
  //   return <div>loading...</div>
  // }
  return (
    <>
      <div className="flex flex-col my-6 space-y-8 text-left border-b-2 border-gray-400 md:mx-6">
        <div className="fixed right-0 w-16 h-16 bg-blue-400 top-16 rounded-s-xl">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full h-full font-bold opacity-70 ">
              More...
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Other Deals</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allPicks.map((pick: CBPickData) => {
                return (
                  <DropdownMenuItem key={pick.id}>
                    <Link href={`/destinationdeal/${pick.id}`}>
                      {pick.destination.replaceAll("Destination:", "")}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col items-center justify-center md:grid md:grid-flow-col md:-mt-10">
          <Image
            src={shipLogos(data.title)}
            width={100}
            height={100}
            alt="data.tile"
          />
          <Container1Header
            headerText={data.title.replaceAll('"', "") || "nothing"}
          />
        </div>
        <div className="flex flex-col md:flex-row ">
          <div className="flex flex-col">
            <p>{data.mainImage}</p>
            <img
              alt={data.mainImageAlt || "vacation image"}
              src={data.featuredImage || ""}
              width="500px"
              height="500px"
            />
          </div>
          <div className="p-4 text-lg ">
            <h3>DEAL INCENTIVES</h3>
            {data.featuresText !== "-" &&
              data.featuresText.split("- ").map((feature: string) => {
                return (
                  feature !== "" && (
                    <div className="flex gap-3 text-sm font-extralight">
                      {/* <InfoIcon size={20} /> */}
                      <p>*</p>
                      {feature.trim()}
                    </div>
                  )
                );
              })}
          </div>
          <br />
        </div>
        <div className="flex flex-col gap-4">
          <div className="col-span-2 text-sm text-center underline md:mr-auto md:text-left">
            {data.subtitle}
          </div>
          <div className="space-y-3 text-sm font-extra-light md:w-1/3">
            <p className="flex gap-4 border-b-2">
              <DollarSign color="blue" size={16} />
              Starting at {data.price} per person!
            </p>
            <p className="flex gap-4 border-b-2">
              <Calendar color="red" size={16} />
              {data.tripLength}
            </p>
          </div>
        </div>
        <p className="text-lg underline font-extralight">Ports of interest</p>
        <div className="text-md bg-gray-50">
          {String(data.itinerary)
            .replaceAll("- ", ", ")
            .split(`, `)
            .map((line: string) => {
              return line !== "" && <div className="p-3">* {line.trim()}</div>;
            })}
        </div>
        <br />

        <div className="bg-slate-100">
          {String(data.bodyText)
            .split(`\n`)
            .map((line: string) => {
              return line !== "" && <div className="p-3">{line.trim()}</div>;
            })}
        </div>
        <br />
      </div>
    </>
  );
}
