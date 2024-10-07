import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import Page from "../../layouts/root/components/page";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  let errorMessage = "";
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <Page title="Oops!">
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </Page>
  );
}
