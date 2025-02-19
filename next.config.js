/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "gpts-works.s3.us-west-1.amazonaws.com",
      "trysai.s3.us-west-1.amazonaws.com",
      "r2.trys.ai",
      "r2.gpts.works",
      "154.221.23.232",
    ],
  },
};

module.exports = nextConfig;
