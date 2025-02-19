import { respData, respErr } from "@/lib/resp";

import { User } from "@/types/user";
import { Wallpaper } from "@/types/wallpaper";
import { currentUser } from "@clerk/nextjs";
import { getUserCredits } from "@/services/order";
import { insertWallpaper } from "@/models/wallpaper";
import { saveUser } from "@/services/user";
import { text2ImageSync, Text2ImageParams, Text2ImageResponse } from "@/services/apiService";
import { genUuid } from "@/lib";


export async function POST(req: Request) {

  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("no auth");
  }

  try {
    const { description, file_id, aspect_ratio } = await req.json();
    if (!description) {
      return respErr("invalid params");
    }

    // save user
    const user_email = user.emailAddresses[0].emailAddress;
    const nickname = user.firstName;
    const avatarUrl = user.imageUrl;
    const userInfo: User = {
      email: user_email,
      nickname: nickname || "",
      avatar_url: avatarUrl,
    };

    await saveUser(userInfo);

    const user_credits = await getUserCredits(user_email);
    if (!user_credits || user_credits.left_credits < 1) {
      return respErr("credits not enough");
    }

    const text2img_params: Text2ImageParams = {
      data: {
        text: description,
        file_id: file_id,
        aspect_ratio: aspect_ratio,
      },
    };
    const created_at = new Date().toISOString();
    console.log("Starting text2ImageSync with params:", text2img_params);
    const res: Text2ImageResponse = await text2ImageSync(text2img_params);
    console.log("text2ImageSync completed:", res);
    const raw_img_url = res.data.result.url_list[0];
    if (!raw_img_url) {
      return respErr("generate wallpaper failed");
    }

    const img_name = encodeURIComponent(description);
    const img_uuid = genUuid();
    const wallpaper: Wallpaper = {
      user_email: user_email,
      img_description: description,
      img_size: aspect_ratio,
      img_url: raw_img_url,
      llm_name: '0',
      llm_params: JSON.stringify(text2img_params),
      created_at: created_at,
      uuid: img_uuid,
    };
    await insertWallpaper(wallpaper);

    return respData(wallpaper);
  } catch (e) {
    console.log("generate wallpaper failed: ", e);
    return respErr("generate wallpaper failed");
  }
}
