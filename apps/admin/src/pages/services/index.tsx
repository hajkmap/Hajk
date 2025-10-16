import { Service } from "../../api/services";
import ServicesList from "./components/services-list";

// Filter function for all services
const filterAllServices = (services: Service[]): Service[] => {
  return services;
};

export default function ServicesPage() {
  return (
    <ServicesList
      filterServices={filterAllServices}
      showCreateButton={true}
      pageTitleKey="common.services"
      baseRoute="/services"
    />
  );
}
