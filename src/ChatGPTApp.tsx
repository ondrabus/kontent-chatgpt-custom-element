import { FC, useCallback, useEffect, useState } from 'react';
import { Configuration, OpenAIApi } from "openai";

export const ChatGPTApp: FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [itemName, setItemName] = useState<string | null>(null);
  const [elementValue, setElementValue] = useState<string | null>(null);
  const [openAi, setOpenAi] = useState<OpenAIApi | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('')

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isConfig(element.config)) {
        throw new Error('Invalid configuration of the custom element. Please check the documentation.');
      }

      setConfig(element.config);
      setProjectId(context.projectId);
      setIsDisabled(element.disabled);
      setItemName(context.item.name);
      setElementValue(element.value ?? '');
    });
  });

  useEffect(() => {
    CustomElement.setHeight(200);
  }, []);

  useEffect(() => {
    CustomElement.onDisabledChanged(setIsDisabled);
  }, []);

  useEffect(() => {
    CustomElement.observeItemChanges(i => setItemName(i.name));
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    if (!openAi){
      console.log('creating openai with key ' + config.apiKey)
      const configuration = new Configuration({
        apiKey: config.apiKey
      })
      setOpenAi(new OpenAIApi(configuration));
    }
  }, [config, openAi]);

  const getResponse = async (e: any) => {
    e.preventDefault();
    if (!config || !openAi){
      throw new Error('Config or Open AI not initialized.')
    }

    try {
      const data = await openAi.createCompletion({
        model: "text-davinci-003",
        prompt: `${config.prompt} ${prompt}`,
        temperature: 0.6,
        max_tokens: 128,
      })

      setGeneratedText(data.data.choices[0]?.text?.toString() ?? '')
    } catch(error: any) {
      // Consider adjusting the error handling logic for your use case
      if (error.response) {
        console.error(error.response.status, error.response.data);
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
      }
    }
  }

  const updateValue = (newValue: string) => {
    
    CustomElement.setValue(newValue);
    setElementValue(newValue);
  };

  if (!config || !projectId || elementValue === null || itemName === null) {
    return null;
  }

  return (
    <>
    {elementValue && <p style={{marginBottom: '20px'}}>{elementValue}</p>}
    {!isDisabled && <form onSubmit={getResponse}>
        <label className="form__label" style={{margin: '10px 0', color: '#525252'}}>What's the update?</label>
        <div style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
          <input className="text-field__input" style={{maxWidth: 300}} type="text" name="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} />
          <input type="submit" name="submit" value="GO" className="btn btn--primary" />
        </div>
      </form>}
    <p style={{margin: '20px 0 10px', color: '#525252', fontSize: '16px'}}>
      {generatedText}
    </p>
    {generatedText.length > 0 && generatedText !== elementValue && <button onClick={() => { updateValue(generatedText); setGeneratedText('');}} className="btn btn--secondary btn--s">I'll take it</button>}
    </>
  );
};

ChatGPTApp.displayName = 'Chat GPT';

type Config = Readonly<{
  apiKey: string;
  prompt: string;
}>;

// check it is the expected configuration
const isConfig = (v: unknown): v is Config =>
  isObject(v) &&
  hasProperty(nameOf<Config>('apiKey'), v) &&
  typeof v.apiKey === 'string' &&
  hasProperty(nameOf<Config>('prompt'), v) &&
  typeof v.prompt === 'string';

const hasProperty = <PropName extends string, Input extends {}>(propName: PropName, v: Input): v is Input & { [key in PropName]: unknown } =>
  v.hasOwnProperty(propName);

const isObject = (v: unknown): v is {} =>
  typeof v === 'object' &&
  v !== null;

const nameOf = <Obj extends Readonly<Record<string, unknown>>>(prop: keyof Obj) => prop;
