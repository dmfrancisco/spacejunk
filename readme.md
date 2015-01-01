![SpaceJunk logo](http://dmfranc.com/assets/spacejunk.svg)

SpaceJunk is an opinionated cloud-based TiddlyWiki setup. [TiddlyWiki](http://tiddlywiki.com) is a free and open web application you can setup for yourself. It is highly customizable, so you can use it the way you want. Everything you create is yours and in your control.

TiddlyWiki comes in several flavours. You can:

- Open it in your browser and save everything in a single file
- Use a browser extension to automatically save the content to your disk
- Run it like a Desktop or iPhone app
- Install it in a web server and make it accessible to anyone

Only recently I decided to learn more about the project and experiment with it. It is a 10-year-old ever-evolving project and it can be a little daunting at first. The project is so open-ended that sometimes it may be hard for non-tech people to fully understand.

I built my own setup for fun, called **SpaceJunk**. It configures two great free services — [Heroku](https://heroku.com), a cloud platform to host websites / web applications, and [Dropbox](https://dropbox.com), to store contents in the form of files. It also contains a couple of additional plugins and themes.

The setup process was designed to be simple for people unfamiliar with web development tools. If you are a programmer looking at the code, I did a bunch of stupid stuff (like monkeypatching standard libraries or using git branches like they were separate repos). This is not meant to be a fork or a serious open source project in any way :poop: It's just a side-project.


### Getting started

To start you will need a free [Dropbox](https://dropbox.com) account and a free [Heroku](https://heroku.com) account. Then:

1. Go to your Dropbox account and [create a new Dropbox Platform app](https://www.dropbox.com/developers/apps/create), which will be used to store your contents
2. Fill the form like this:
  ![Create Dropbox App](http://dmfranc.com/assets/spacejunk/step-a.png)
3. Now go to your new [app's settings page](https://dropbox.com/developers/apps) and generate an Access Token by clicking "Generate" (in the OAuth 2 section)
5. You will need these 3 keys for the next step:
  ![Copy your new keys](http://dmfranc.com/assets/spacejunk/step-b.png)
4. You can now setup a new server hosted on Heroku by clicking this button: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/dmfrancisco/spacejunk/tree/master)
6. After filling the form, click "Deploy for Free". Once you are greeted with the message "Your app was successfully deployed", follow the link "Make your first edit" to connect your new Heroku app with your Dropbox account. Click "Connect to Dropbox":
  ![Connect Heroku with Dropbox](http://dmfranc.com/assets/spacejunk/step-c.png)
7. Now you just need to restart the server by going to "Settings", clicking "Reveal Config Vars" and editing the `MAGIC_NUMBER` to a number of your choosing. Click Save.

That's it! Visit your new page by going to: <http://myappname.herokuapp.com>

---

For additional documentation, visit this page: <http://tryspacejunk.herokuapp.com>
