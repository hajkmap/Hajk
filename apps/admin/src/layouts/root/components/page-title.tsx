import { useEffect } from "react";
import { useLocation } from "react-router";

interface Props {
  title: string;
}

const PageTitle = ({ title }: Props) => {
  const location = useLocation();

  useEffect(() => {
    document.title = title;
  }, [location, title]);

  return null;
};

export default PageTitle;
