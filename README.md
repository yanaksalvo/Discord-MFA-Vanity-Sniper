# Discord MFA Fix Vanity-Url Sniper
A tool designed to monitor Discord servers' vanity URLs and the GUILD_UPDATE event, and to bypass MFA in order to capture the vanity URL whenever an update occurs.

# 🛠️ Installation 🛠️

- Download and install [Node JS](https://nodejs.org/en/download) and  [GO](https://go.dev/doc/install) on your computer.
- Download the project as Zip to your computer and unzip it.
- Enter the folder you extracted from the zip and let's start by installing the necessary modules.
- Open the terminal and type `npm install` to install the Node JS modules.
- After the modules are installed, open the `index.js` and `mfa.go` files and enter the required Token, Server ID, and Password information.
# ⛳ Usage ⛳

- After filling in the required information, run `mfa.bat`.
- After waiting for a while, when you see the "MFA saved" message in the console, the `mfatoken.json` file will be created. Do not touch this file under any circumstances.
- After the MFA token is created, you can run the code by opening `snip.bat`.
- The console screen will display the MFA token. The MFA token will always renew itself and remain active.
- You will see the servers with the enabled vanity URL feature, which are being tracked, in the console under Server ID and Vanity URL.
- Never close the opened `mfa.bat` and `snip.bat` files.


### NOTE: The MFA token will be continuously generated and saved to the JSON file without any errors. A stable remote desktop connection will significantly speed up the process, and location is very important in this regard.

---
- 🏓 [Web Site](https://www.kemosalvo.com)<br>
- ☄️ [Click For Contact Telegram](https://t.me/tehlikeliadam)<br>

# 🎯 License 🎯
- ⚖️ The code is entirely mine. I am taking ownership of its license. In case it is shared anywhere, a notification will be made to the relevant authorities, and legal action will be taken. In the event of misuse, you can contact me via the communication address I mentioned above, and I will initiate legal proceedings.

