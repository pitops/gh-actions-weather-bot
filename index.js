require('dotenv').config()

const fetch = require('node-fetch')
const weatherToken = process.env.ACCUWEATHER_API_KEY
const Slack = require('slack-node')

const slackWebhookSecret = process.env.SLACK_WEBHOOK_SECRET

const slack = new Slack()
slack.setWebhook(`https://hooks.slack.com/services/${slackWebhookSecret}`)

const limassolLocationKey = process.env.LIMASSOL_LOCATION_KEY

const weatherURL = new URL(
  `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${limassolLocationKey}`
)
weatherURL.searchParams.set('apikey', weatherToken)
weatherURL.searchParams.set('metric', true)

const getWeatherData = async () => {
  const resp = await fetch(weatherURL.toString())
  const body = await resp.json()
  return body
}

const generateWeatherMessage = weatherData =>
  `The weather in Limassol: ${weatherData.Headline.Text}. Highest temperature will be ${weatherData.DailyForecasts[0].Temperature.Maximum.Value} °C, and lowest temperature will be ${weatherData.DailyForecasts[0].Temperature.Minimum.Value} °C`

const postToSlack = message => {
  slack.webhook(
    {
      channel: '#general',
      username: 'Kokoras',
      text: message
    },
    (error, response) => console.log(error)
  )
}

const main = async () => {
  const weatherData = await getWeatherData()
  const weatherString = generateWeatherMessage(weatherData)
  postToSlack(weatherString)
}

main()
