import { toast } from "react-toastify";

export function handleApiError(err, defaultMsg = "An error occurred. Please try again.") {
  if (err.response?.data?.errors) {
    const errorMessages = Object.values(err.response.data.errors)
      .flat()
      .join("\n");
    toast.error(errorMessages);
  } else {
    toast.error(err.response?.data?.message || defaultMsg);
  }
}
