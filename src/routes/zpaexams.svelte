<script context="module">
import { request, gql } from 'graphql-request'

const query = gql`
query {
  zpaexams(fromZPA: false) {
    semester
    anCode
    module
    mainExamer
    mainExamerID
    examType
    duration
    isRepeaterExam
    groups
  }
}
`

export const load = async () => {
    const data = await request('http://localhost:8080/query', query)
    
    return {
        props: {
            data
        }
    }
}

</script>

<script>
    export let data
</script>

<h1>
    Prüfungsliste aus dem ZPA
</h1>

<ul>
    {#each data.zpaexams as zpaexam}
    <li>{zpaexam.anCode}.
        {zpaexam.module},
        {zpaexam.mainExamer}
        (<i>{zpaexam.examType}</i>)
    </li>
    {/each}
</ul>