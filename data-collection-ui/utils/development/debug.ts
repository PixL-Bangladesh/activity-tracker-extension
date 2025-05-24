export const printIfDev = ({
  errorObject,
  message,
}: {
  errorObject?: unknown;
  message?: string;
}) => {
  if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
    if (message) {
      console.log(message);
    }
    if (errorObject) {
      console.error("Error details:", errorObject);
    }
  }
};
