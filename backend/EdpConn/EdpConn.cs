//#define USE_REF_TO_EDP // Uncomment to enable EDP integration

using System;
using System.Collections.Generic;
using log4net;

#if USE_REF_TO_EDP
using EDP.GIS.Kubb.Connector.EDP;
using EDP.GIS.Kubb.Connector.Common.Factories;
using EDP.GIS.Kubb.Connector.Common.Entities;
#endif

/// <summary>
/// Denna klass implementerar kommunikationen med EDP. 
/// Vill man kompilera backend med kommuniaktion till EDP gör följande:
/// 1. Ta bort kommentarstecknen på raden //#define USE_REF_TO_EDP överst i denna fil
/// 
/// Skulle man ha problem med att NuGet inte kan hämta referenserna, trots att man har kommenterat översta raden,
/// kan man ta bort referenserna till:
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
        public void Disconnect()
        {
            _implEdpConnector.Disconnect();
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
        ILog _log = LogManager.GetLogger(typeof(ImplEdpConnector));
        string _user;

        public ImplEdpConnector(string user, string organisation, string client, string serverUrl)
            : base(new HubConnectionFactory(), new HubProxyFactory(), user, organisation, client, serverUrl)
        {
            _user = user;
            OpenConnection();
        }

        public void Disconnect()
        {
            this.HubConnection.Stop();
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
            _log.DebugFormat("ImplEdpConnector.HandleAskingForRealEstateIdentifiers called for user '{0}'.", _user);
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

        public void Disconnect() { }

        public void SetRealEstateIdentifiersToSend(List<RealEstateIdentifierPublic> newList)
        {
        }
    }
#endif
}
