// #define USE_REF_TO_EDP // Uncomment to enable EDP integration

using System;
using System.Collections.Generic;

#if USE_REF_TO_EDP
using EDP.GIS.Kubb.Connector.EDP;
using EDP.GIS.Kubb.Connector.Common.Factories;
using EDP.GIS.Kubb.Connector.Common.Entities;
#endif

/// <summary>
/// Denna klass implementerar kommunikationen med EDP. 
/// Vill man kompilera backend utan några beroenden alls till EDP gör följande:
/// 1. Kommentera raden #define USE_REF_TO_EDP överst i denna fil
/// 2. Man kan nu även ta bort referenserna till:
///    - EDP.GIS.Kubb.Connector.Common
///    - EDP.GIS.Kubb.Connector.EDP
///    - Microsoft.AspNet.SignalR.Client
/// </summary>

namespace EdpConn
{
    public class RealEstateIdentifierPublic
    {
        public RealEstateIdentifierPublic() { }

        public string Fnr { get; set; }
        public string Municipality { get; set; }
        public string Name { get; set; }
        public string Uuid { get; set; }
    }


#if USE_REF_TO_EDP
    public class ImplEdpConnectorPublic
    {
        private ImplEdpConnector _implEdpConnector = null;
        public ImplEdpConnectorPublic(string user, string organisation, string client, string serverUrl)
        {
            _implEdpConnector = new ImplEdpConnector(user, organisation, client, serverUrl);
        }

        public void SetRealEstateIdentifiersToSend(List<RealEstateIdentifierPublic> newList)
        {
            _implEdpConnector.RealEstateIdentifiersToSend = new List<RealEstateIdentifier>();

            foreach (var newRealEstate in newList)
            {
                _implEdpConnector.RealEstateIdentifiersToSend.Add(new RealEstateIdentifier
                {
                    Fnr = newRealEstate.Fnr,
                    Municipality = newRealEstate.Municipality,
                    Name = newRealEstate.Name,
                    Uuid = newRealEstate.Uuid
                });
            }
        }

    }


    class ImplEdpConnector : EdpConnector
    {
        public ImplEdpConnector(string user, string organisation, string client, string serverUrl)
            : base(new HubConnectionFactory(), new HubProxyFactory(), user, organisation, client, serverUrl)
        {
            OpenConnection();
        }

        public List<RealEstateIdentifier> RealEstateIdentifiersToSend = null;

        // public List<Coordinate> CoordinatesToSend = null; // not implemented

        public override void HandleRealEstateIdentifiers(List<RealEstateIdentifier> realEstates)
        {
            // Do not zoom and select real estate in this version
        }

        public override void HandleCoordinates(List<Coordinate> coordinates)
        {
            // Do not display coordinate in this version
        }

        public override void HandleAskingForCoordinates()
        {
            // Do not handle coordinates in this version
            //SendCoordinates(null);
        }

        public override void HandleAskingForRealEstateIdentifiers()
        {
            if (RealEstateIdentifiersToSend != null)
                SendRealEstateIdentifiers(RealEstateIdentifiersToSend);
        }

        public override void HandleError(string methodCalled)
        {
        }
    }

#else
    // Tom klass som inte gör något
    public class ImplEdpConnectorPublic
    {
        public ImplEdpConnectorPublic(string user, string organisation, string client, string serverUrl)
        {
        }

        public void SetRealEstateIdentifiersToSend(List<RealEstateIdentifierPublic> newList)
        {
        }
    }
#endif
}
