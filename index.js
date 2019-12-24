require('dotenv').config()

const fetch = require('node-fetch')
const Slack = require('slack-node')
const util = require('util')

const weatherToken = process.env.ACCUWEATHER_API_KEY
const slackWebhookSecret = process.env.SLACK_WEBHOOK_SECRET

const CITIES = [
  {
    name: 'Limassol',
    locationKey: '124034'
  },
  {
    name: 'Abu Dhabi',
    locationKey: '321626'
  }
]

const slack = new Slack()
slack.setWebhook(`https://hooks.slack.com/services/${slackWebhookSecret}`)

// Promisify the slack webhook method
const slackWebhook = util.promisify(slack.webhook)

const weatherURL = locationKey => {
  const url = new URL(
    `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationKey}`
  )

  url.searchParams.set('apikey', weatherToken)
  url.searchParams.set('metric', true)

  return url
}

const getWeatherData = async locationKey => {
  const resp = await fetch(weatherURL(locationKey).toString())
  const body = await resp.json()
  return body
}

const generateWeatherMessage = (weatherData, city) =>
  `The weather in *${city}*: ${weatherData.Headline.Text}. Highest temperature will be *${weatherData.DailyForecasts[0].Temperature.Maximum.Value}* °C, and lowest temperature will be *${weatherData.DailyForecasts[0].Temperature.Minimum.Value}* °C`

const postToSlack = async message => {
  await slackWebhook({
    channel: '#general',
    username: 'Kokoras',
    text: message
  })
}

const main = async () => {
  for (let i = 0; i < CITIES.length; i++) {
    const { name, locationKey } = CITIES[i]

    try {
      const weatherData = await getWeatherData(locationKey)
      const weatherString = generateWeatherMessage(weatherData, name)
      await postToSlack(weatherString)
    } catch (err) {
      await postToSlack(`Unable to get weather data. Error: ${err.message}`)
    }
  }
}

main()
