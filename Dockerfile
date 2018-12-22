# Create an image based on https://github.com/mhart/alpine-node/tree/f7fedaee10cf8569f4e3eb2c3391eb244636acb6
FROM mhart/alpine-node:10

# Create a directory where RTL app will be placed
RUN mkdir -p /usr/rtl

# Change the work directory to run the commands
WORKDIR /usr/rtl

# Copy all build files to the working directory
COPY RTL /usr/rtl

# Install dependencies
RUN npm install

# Get all the code needed to run the RTL app
COPY . /usr/rtl

# Expose the port the app run on
EXPOSE 3000

#Run the app server
CMD ["node", "rtl", "--lndir", "$macaroondirectorypath"]
