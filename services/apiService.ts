// apiService.ts

export interface Text2ImageResponse {
  code: string;
  data: {
    url_list: string[];
  };
  msg: string;
}

export interface Text2ImageParams {
  data: {
    text: string;
  };
}

export const text2ImageSync = async (params: Text2ImageParams): Promise<Text2ImageResponse> => {
  const url = "http://127.0.0.1:5000/api/ai_task/text2_image_sync?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2fQ.CyY_ZrMuS2I4l6QuiSyPtFCyLGe01LtavgPBEpkZ8Po";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result: Text2ImageResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
