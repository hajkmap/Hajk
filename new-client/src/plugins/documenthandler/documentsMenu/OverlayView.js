import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import HeaderView from "./HeaderView";
import MenuView from "./MenuView";
import Modal from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import DocumentHandlerModel from "../DocumentHandlerModel";

const styles = theme => ({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    outline: "none",
    minHeight: "80%",
    marginTop: "5%",
    marginBottom: "5%",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
      overflow: "scroll",
      marginTop: 0,
      marginBottom: 0
    }
  },
  menuItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(30),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    backgroundColor: "rgba(38, 44, 44, 0)",
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      height: "100%"
    }
  }
});

/*{
      color: "#e0d0e7",
      header: "Utvecklingsstrategi",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    },
    {
      color: "#bfe4f2",
      header: "Tematiska inriktningar",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    },
    {
      color: "#008767",
      header: "Riksintressen",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    },
    {
      color: "#d1d9dc",
      header: "Hållbarhetsbedömning",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    },
    {
      color: "#ffffff",
      header: "Fördjupningar",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    },
    {
      color: "#ffffff",
      header: "Tematiska tillägg",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    },
    {
      color: "#ffffff",
      header: "Markanvändningskarta",
      keywords: [],
      geoids: [],
      html:
        "<p>Detta kapitel beskriver information om riksintressen som till <em>exempel</em> naturreservat eller nationalparker.</p>\n<h2>Naturreservat</h2>\n<blockquote>Här är ett citat</blockquote>\n<p>Inom ramen för <strong>översiktsplanering</strong> hanterar kommunen naturreservat, det är länsstyrelsen som beslutar och vårdar dessa.</p>\n<h1>Nationalpark</h1>\n<p>En nationalpark är ett riksintresse som hanteras av staten, inom detta område finns tydliga restriktioner i hur kommunen får nyttja marken.&nbsp;</p>\n<p><br></p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam dapibus tincidunt. Aliquam sit amet metus imperdiet, pharetra lacus et, pharetra erat. Vestibulum ligula risus, elementum a luctus vitae, maximus a odio. Proin rhoncus sapien in est venenatis, ac egestas velit tincidunt. Maecenas fringilla leo non urna cursus hendrerit. Maecenas pretium faucibus leo at lobortis. Nam blandit rutrum eros ac volutpat. Maecenas fermentum augue mauris, quis fringilla urna blandit a.</p>\n<p><br></p>\n<p>Ut vitae nibh quam. Nam tincidunt dignissim ipsum, vel vestibulum felis interdum quis. Etiam eu dignissim magna, vitae vestibulum elit. Ut a faucibus felis, quis elementum sem. Ut ut posuere eros, vitae imperdiet nisl. Sed molestie dapibus enim, et auctor ligula ultricies ac. Sed ultrices vitae eros non volutpat. Nullam arcu dolor, pharetra a mi eu, auctor luctus ipsum. Mauris sagittis libero feugiat est commodo, vitae scelerisque mauris pellentesque. Donec a eleifend nisi. Nulla vehicula orci quis ex euismod bibendum.</p>\n<p>Aliquam vel vulputate nisl. Mauris eget elit semper, gravida nunc et, auctor sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec nec elit eget erat aliquam finibus. Mauris fermentum iaculis augue ac molestie. Maecenas ac gravida elit, eget consectetur turpis. Cras a vestibulum est, quis scelerisque sapien. Vestibulum elementum sapien non enim imperdiet, vel posuere nisi accumsan. Donec et eros eleifend metus accumsan tincidunt id quis justo.</p>\n<p><br></p>\n<p>Duis nunc enim, vestibulum eget lectus ut, fermentum ultricies diam. Nullam euismod pellentesque interdum. Phasellus tempor, metus quis elementum pharetra, elit nulla ornare nisi, vel congue urna felis id mi. Pellentesque id rhoncus mi, sed lacinia tortor. Phasellus libero tellus, facilisis ac mauris nec, cursus fermentum augue. Aenean tincidunt, tortor in tincidunt fermentum, tortor ipsum pretium nisl, vitae volutpat ex magna vel mauris. Ut dignissim tincidunt diam at iaculis. Fusce in commodo metus. Vestibulum eleifend metus quis pharetra rutrum. Curabitur ut tortor in tortor egestas tristique et ut mi. Phasellus a ipsum in ex luctus maximus. Sed nunc dolor, ornare lacinia faucibus sed, dapibus ac odio. Nam varius vehicula leo, eu commodo neque finibus quis. Nullam sagittis erat sit amet justo gravida mattis. Duis ac metus id velit elementum pellentesque.</p>\n<p><br></p>\n<p>Phasellus sollicitudin diam non imperdiet pharetra. Morbi vitae ultricies est, eget lobortis libero. Proin lacinia mollis sem, in porttitor urna lobortis quis. Curabitur lectus diam, mattis pellentesque turpis in, egestas condimentum est. Vestibulum vehicula dictum lectus, posuere posuere lacus convallis iaculis. Integer at nisl sagittis, blandit arcu viverra, volutpat odio. Nunc faucibus augue at congue interdum. Aenean et rutrum augue, vel consectetur mauris. Pellentesque egestas diam vel dui mattis, id accumsan purus accumsan. Fusce eu quam urna. Aliquam eu ligula nec nisi facilisis suscipit.</p>",
      mapSettings: {
        center: [415728, 6583754],
        zoom: 12,
        extent: [415288.5, 6583342, 416167.5, 6584166]
      }
    }*/

const fullWidth = 12;
const mapDiv = document.getElementById("map");

class OverlayView extends React.PureComponent {
  state = {
    open: true,
    subMenu: false,
    activeDocument: null,
    menuItems: []
  };

  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
    super(props);

    this.documentHandlerModel = new DocumentHandlerModel();
    this.initializeDocumentMenu();
    this.globalObserver = this.props.app.globalObserver;
    this.bindSubscriptions();
  }

  getMainChapters = header => {
    var document = this.documents.filter(document => {
      return document.header === header;
    })[0];

    return document.chapters;
  };

  //MAKE RECURSIVE
  getSubChapters = header => {
    var activeDocument = this.documents.find(document => {
      return document.header === this.state.activeDocument;
    });

    return activeDocument.chapters.filter(chapter => {
      return chapter.header === header;
    })[0].chapters;
  };

  initializeDocumentMenu = () => {
    var promises = [];
    this.documentHandlerModel.list(documentTitles => {
      documentTitles.map(header => {
        promises.push(
          new Promise((resolve, reject) => {
            this.documentHandlerModel.load(header, document => {
              resolve(document);
            });
          })
        );
      });
      Promise.all(promises).then(documents => {
        this.documents = documents;
        this.setState({
          menuItems: documents
        });
      });
    });
  };

  setMainChaptersMenu = header => {
    this.setState({
      menuItems: this.getMainChapters(header),
      activeDocument: header,
      subMenu: true
    });
  };

  setSubChaptersMenu = header => {
    this.setState({
      menuItems: this.getSubChapters(header),
      subMenu: true
    });
  };

  setMenuView = header => {
    if (this.isMainDocument(header)) {
      this.setMainChaptersMenu(header);
    } else {
      this.setSubChaptersMenu(header);
    }
  };

  isMainDocument = header => {
    return this.documents
      .map(document => {
        return document.header;
      })
      .includes(header);
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;

    localObserver.subscribe("menu-item-clicked", header => {
      this.setMenuView(header);
    });
    localObserver.subscribe("goToParentChapters", parent => {
      console.log(parent, "parent");
    });
  };

  handleMapBlur = () => {
    if (this.state.open) {
      mapDiv.setAttribute("style", "filter : blur(7px)");
    } else {
      mapDiv.removeAttribute("style", "filter : blur(7px)");
    }
  };

  close = () => {
    this.setState({ open: false });
  };
  /*
  reset = () => {
    this.setState({
      menuItems: mockedMenuItems.filter(document => {
        return document.mainDocument;
      }),
      subMenu: false
    });
  };
*/
  render() {
    const { classes, app, localObserver } = this.props;
    this.handleMapBlur();
    return (
      <>
        <Modal
          className={classes.modal}
          onBackdropClick={this.close}
          open={this.state.open}
        >
          <Container className={classes.container} fixed>
            <Grid zeroMinWidth item xs={fullWidth}>
              <HeaderView
                subMenu={this.state.subMenu}
                menuItems={this.state.menuItems}
                localObserver={localObserver}
              ></HeaderView>
            </Grid>
            <Grid container>
              <MenuView
                app={app}
                menuItems={this.state.menuItems}
                localObserver={localObserver}
              ></MenuView>
            </Grid>
          </Container>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayView));
